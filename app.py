import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from chromedriver_py import binary_path
import time

def scrape_yelp(zip):

    url = "https://www.yelp.com/search?find_desc=Restaurants+-+Takeout&find_loc=" + str(zip) + "&ns=1"
    future_pages = []
    restaurant_links = []
    free_food = []
    counter = 0

    def get_pages():
        r = requests.get(url)
        bs = BeautifulSoup(r.text, 'html.parser')
        mydivs = bs.find_all("a", {"class": "css-166la90"})
        for mydiv in mydivs:
            if "start" in mydiv['href']:
                future_pages.append(mydiv['href'])
        future_pages.pop()
    get_pages()

    def get_restaurant_links():
        future_pages.append(url)
        for page in future_pages:
            r = requests.get(page)
            bs = BeautifulSoup(r.text, 'html.parser')
            mydivs = bs.find_all("a", {"class": "css-166la90"})
            for mydiv in mydivs:
                if "biz" in mydiv['href']:
                    restaurant_links.append("yelp.com" + mydiv['href'])
    get_restaurant_links()

    driver = webdriver.Chrome(executable_path=binary_path)

    for restaurant in restaurant_links:
        print(str(counter + 1) + "/" + str(len(restaurant_links)))
        driver.get("https://" + restaurant)
        time.sleep(3)
        start_order = driver.find_elements_by_class_name("css-1s7bvhq")
        if(len(start_order) > 0):
            start_order[0].click()
            time.sleep(5)
            prices = driver.find_elements_by_class_name("price__85e3c__1tCyb")
            for price in prices:
                if (price.text == "$0.00"):
                    print("FREE FOOD: ", restaurant)
                    free_food.append(restaurant)
        counter = counter + 1
    print("Summary")
    for restaurant in free_food:
        print("Restaurant: ", restaurant)

# enter zip code
scrape_yelp(84045)
# 10014